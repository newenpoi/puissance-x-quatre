function play_sound(sound)
{
	sound.play();
	sound.currentTime = 0;
}

function free(element)
{
    /*
        Si la case n'a pas été jouée.
    */

    return (!element.hasClass('played'));
}

function available(element)
{
    /*
        Renvoie la rangée et la colonne jouable.
    */

    data = element.attr('id').split('_');

    row = data[1];
    col = data[2];

    for (var i = 1; i <= 6; i++)
    {
        if (free($('#case_' + i + '_' + col)))
        {
            return [i, parseInt(col)];
        }
    }

    return false;
}

function cell(r, c)
{
    // Renvoie la case sous forme d'objet JQuery.

    return $('#case_' + r + '_' + c);
}

function get_cell_player(r, c)
{
    return $('#case_' + r + '_' + c).css('backgroundColor');
}

function validate(pos, vector, player, nbJeton)
{
    /*
        Fonction récursive pour compter le nombre de jetons de la même couleur, sur le même vecteur (vector[tr, td]).
    */

    if ($("#case_" + pos[0] + "_" + pos[1] + ".played." + player).length > 0)
    {
        // On stop la récursivité pour ne pas faire des tests inutiles.
        if (nbJeton == 3) return 4;
        return validate([parseInt(pos[0]) + vector[0], parseInt(pos[1]) + vector[1]], vector, player, nbJeton + 1);
    }

    return nbJeton;
}

function victory(pos, player)
{    
    res = false;

    // Lig ; Col ; RevLiv ; RevCol.
    cas1 = [[0,-1], [ 0, 1]];
    cas2 = [[1,-1], [-1, 1]];
    cas3 = [[1, 0], [-1, 0]];
    cas4 = [[1, 1], [-1,-1]];
    
    // Horizontale.
    nbJeton = validate([parseInt(pos[0]) + cas1[0][0], parseInt(pos[1]) + cas1[0][1]], cas1[0], player, 1);
    nbJeton = validate([parseInt(pos[0]) + cas1[1][0], parseInt(pos[1]) + cas1[1][1]], cas1[1], player, nbJeton);  
    if (nbJeton >= 4) return true;
    
    // Diagonale Descendante.
    nbJeton = validate([parseInt(pos[0]) + cas2[0][0], parseInt(pos[1]) + cas2[0][1]], cas2[0], player, 1);
    nbJeton = validate([parseInt(pos[0]) + cas2[1][0], parseInt(pos[1]) + cas2[1][1]], cas2[1], player, nbJeton);    
    if (nbJeton >= 4) return true;

    // Verticale.
    nbJeton = validate([parseInt(pos[0]) + cas3[0][0], parseInt(pos[1]) + cas3[0][1]], cas3[0], player, 1);
    nbJeton = validate([parseInt(pos[0]) + cas3[1][0], parseInt(pos[1]) + cas3[1][1]], cas3[1], player, nbJeton);   
    if (nbJeton >= 4) return true;    

    // Diagonale Ascendante.
    nbJeton = validate([parseInt(pos[0]) + cas4[0][0], parseInt(pos[1]) + cas4[0][1]], cas4[0], player, 1);
    nbJeton = validate([parseInt(pos[0]) + cas4[1][0], parseInt(pos[1]) + cas4[1][1]], cas4[1], player, nbJeton);
    
    if (nbJeton >= 4) return true;
    
    return false;
}

function reset()
{
    $('th, td').each(function() {
        $(this).removeClass();
    });
}

$(document).ready(function() {
    console.log('Ready.');

    var ding = new Audio('snd/ding.wav');
    var current = 0;
    var infos = $('#infos');

    // Conteneur des rangées.
    var rows = $('table tr');

    $('table tr > *').click(function() {
        /*
            Suppression du highlighting.
        */

        rows.children().removeClass('highlight');

        /*
            Recupère la dernière position jouable sur la colonne.
        */
        
        position = available($(this));

        /*
            Si on a une position jouable.
        */

        if (position.length > 0)
        {
            /*
                Joue le jeton jaune ou rouge.
            */

            for (i = 6; i >= position[0]; i--)
            {
                /*
                    Animation (Jeton Tombant)
                */

                setTimeout(function(i, end) {
                    $('#case_' + i + '_' + position[1]).addClass((current ? 'red' : 'yellow'));

                    play_sound(ding);

                    /*
                        Lorsque le jeton touche la dernière case disponible.
                    */

                    if (i == end)
                    {
                        // Au cas où on a unfocus / re-focus la colonne avant la fin de l'animation.
                        rows.children().removeClass('highlight');

                        $('#case_' + i + '_' + position[1]).addClass('played ' + current);

                        /*
                            Vérification Résursive : Position ; Couleur
                        */

                        if (victory(position, current))
                        {
                            $((current ? '.s-red' : '.s-yellow')).html(parseInt($((current ? '.s-red' : '.s-yellow')).html(), 10) + 1);

                            $(infos).html("Victoire des " + (current ? 'Rouge' : 'Jaune') + ".");

                            // Petit délai avant de rafraichir.
                            setTimeout(function(i) {
                                reset();
                                $(infos).html((current ? 'Rouge' : 'Jaune') + ", c'est à Vous.");
                            }, 2048);
                            
                        }
                        else
                        {
                            // On passe au joueur suivant.
                            current = (current ? 0 : 1);

                            $(infos).html((current ? 'Rouge' : 'Jaune') + ", c'est à Vous.");
                        }
                    }
                }, 64 + ((6 - i) * 64), i, position[0]);

                /*
                    Animation (Effacement).
                */

                if (i != position[0])
                {
                    setTimeout(function(i) {
                        $('#case_' + i + '_' + position[1]).removeClass((current ? 'red' : 'yellow'));
                    }, 64 + ((6 - i + 1) * 64), i);
                }
            }
        }
        else
        {
            $(infos).html("Cette colonne n'est plus jouable.");
        }
    });

    rows.children().hover(function() {
        /*
            Ajoute / Retire une classe de surlignage au survol.
            *Récupère la dernière case à surligner.
        */

        var pos = available($(this));

        for (i = 6; i > 0; i--)
        {
            if (!cell(i, pos[1]).hasClass('played'))
            {
                cell(i, pos[1]).addClass('highlight');
            }
        }        

    }, function() {
        rows.children().removeClass('highlight');
    });

    // Réinitialisation.

    $('#reset').click(function() {
        reset();
    });
});